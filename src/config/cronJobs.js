import cron from 'node-cron';
import investmentService from '../services/investment.service.js';

class CronJobs {
  /**
   * Initialize all cron jobs
   */
  init() {
    // Daily interest calculation - runs at midnight every day (00:00)
    this.scheduleDailyInterestCalculation();

    console.log('✅ Cron jobs initialized');
  }

  /**
   * Daily interest calculation cron job
   * Runs at 00:00 (midnight) every day
   */
  scheduleDailyInterestCalculation() {
    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('🕐 Starting daily interest calculation...');
        const startTime = Date.now();

        const results = await investmentService.calculateDailyInterest();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`✅ Daily interest calculation completed in ${duration}s`);
        console.log(`   - Successful: ${successful}`);
        console.log(`   - Failed: ${failed}`);

        if (failed > 0) {
          console.error('❌ Some interest calculations failed:', 
            results.filter(r => !r.success)
          );
        }
      } catch (error) {
        console.error('❌ Daily interest calculation failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC" // Change to your timezone if needed
    });

    console.log('📅 Daily interest calculation scheduled (runs at 00:00 UTC)');
  }

  /**
   * Manual trigger for testing
   */
  async triggerDailyInterestCalculation() {
    try {
      console.log('🔧 Manually triggering daily interest calculation...');
      const results = await investmentService.calculateDailyInterest();
      console.log('✅ Manual trigger completed:', results);
      return results;
    } catch (error) {
      console.error('❌ Manual trigger failed:', error);
      throw error;
    }
  }
}

export default new CronJobs();
